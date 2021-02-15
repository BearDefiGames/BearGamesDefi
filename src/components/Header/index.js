import React, { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import SwiperCore, { Navigation } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import BigNumber from "bignumber.js";
import {CopyToClipboard} from 'react-copy-to-clipboard';

import TokenCardComponent from './TokenCardComponent';
import { useContractContext } from '../../contexts/contractContext';
import contractDetails from '../../utils/contractService/contractDetails';

import 'swiper/swiper.scss';
import './header.scss';

import logo from '../../assets/img/logo.svg'
import scrollUpImg from '../../assets/img/scroll-up.svg'
import github from "../../assets/img/socials/github_header.svg";
import medium from "../../assets/img/socials/Medium-black.svg";
import twitter from "../../assets/img/socials/twitter_header.svg";
import telegram from "../../assets/img/socials/telegram_header.svg";
import youtube from "../../assets/img/socials/youtube_header.svg";
import {github_url, medium_url, telegram_url, twitter_url, youtube_url} from "../Footer";

SwiperCore.use([Navigation]);

function Header() {

    const { walletService, contractService } = useContractContext()

    const [isMenuActive, setIsMenuActive] = React.useState(false)
    const [isTabActive, setIsTabActive] = React.useState(false);
    const [isCounterActive, setCounterActive] = React.useState(false);
    const [isSlidesActive, setSlidesActive] = React.useState(false);
    const [isBuyErc20Active, setBuyErc20Active] = React.useState(false);
    const [pawCardAmount, setPawCardAmount] = React.useState(0);
    const [isCrowdsaleClosed, setCrowdsaleClosed] = React.useState(false)
    const [isRefund, setIsRefund] = React.useState(false)
    const [cardPrice, setCardPrice] = React.useState(0)
    const [balance, setBalance] = React.useState(0)
    const [addressCopied, setAddressCopied] = React.useState(false)

    const pawCardRef = useRef();
    const sliderRef = useRef();
    const sliderButtonRef = useRef();
    const buyErc20Ref = useRef();

    const reload = () => {
        window.location.reload();
    };

    const scrollUp = () => {
        document.documentElement.scrollTop = 0;
    };

    const userAddress = useSelector(({ user }) => user.address);

    const outsidePawCardClick = (e) => {
        const path = e.path || (e.composedPath && e.composedPath())
        if (!path.includes(pawCardRef.current)) {
            setCounterActive(false)
        }
    }

    const outsideSliderClick = (e) => {
        const path = e.path || (e.composedPath && e.composedPath())
        if (!path.includes(sliderRef.current) && !path.includes(sliderButtonRef.current)) {
            setSlidesActive(false)
        }
    }

    const outsideBuyErc20Click = (e) => {
        const path = e.path || (e.composedPath && e.composedPath())
        if (!path.includes(buyErc20Ref.current) && !path.includes(buyErc20Ref.current)) {
            setBuyErc20Active(false)
        }
    }

    const onMenuBtnClick = () => {
        setSlidesActive(false)
        setIsMenuActive(!isMenuActive)
    }

    const handleCountCardsChange = (amount) => {
        const newAmount = +pawCardAmount + amount;
        if (isCrowdsaleClosed && isRefund && (newAmount > balance)) return;
        if (newAmount <= 0) {
            setPawCardAmount(0)
        } else {
            setPawCardAmount(newAmount)
        }
    }

    const handleCountCardsInput = async ({target}) => {
        const amount = target.value;
        if (isCrowdsaleClosed && isRefund && (+amount > balance)) {
            setPawCardAmount(+balance)
        } else {
            setPawCardAmount(+amount)
        };
    }

    const handleBuyToken = async () => {
        try {
            const bought = await contractService.buyManyTokens(userAddress,pawCardAmount)
            // dispatch(modalActions.toggleModal({isOpen:true,text:bought}))
            const balanceOf = await contractService.balanceOf(userAddress)
            setBalance(balanceOf)
        } catch (e) {
            console.error(e);
        }
    }

    const handleRefund = async () => {
        try {
            const burn = await contractService.refundManyTokens(userAddress,pawCardAmount)
            console.log('handleRefund isRefund',isRefund)
            console.log('handleRefund burn',burn)
            const balanceOf = await contractService.balanceOf(userAddress)
            setBalance(balanceOf)
        } catch (e) {
            console.error(e);
        }
    }

    const getData = async () => {
        try {
            if (userAddress) {
                const isRefund = await contractService.isRefund(userAddress)
                setIsRefund(isRefund)
            }
            const isClosed = await contractService.isClosedCrowdsale()
            setCrowdsaleClosed(isClosed)
            const price = await contractService.tokenPrice()
            // dispatch(modalActions.toggleModal({isOpen:true,text:price}))
            setCardPrice(price)
        } catch (e) {
            console.error('Header getData',JSON.stringify(e.message));
            // dispatch(modalActions.toggleModal({isOpen:true,text:`Header getData error: ${JSON.stringify(e.message)}`}))
        }
    }

    const getBalance = async () => {
        try {
            const balanceOf = await contractService.balanceOf(userAddress)
            setBalance(balanceOf)
        } catch (e) {
            console.error(e);
        }
    }

    React.useEffect(() => {
        document.body.addEventListener('click', outsidePawCardClick)
        document.body.addEventListener('click', outsideSliderClick)
        document.body.addEventListener('click', outsideBuyErc20Click)
        return () => {
            document.body.removeEventListener('click', outsidePawCardClick)
            document.body.removeEventListener('click', outsideSliderClick)
            document.body.removeEventListener('click', outsideBuyErc20Click)
        };
    }, []);

    React.useEffect(() => {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 1200) {
                setIsTabActive(true)
            } else {
                setIsTabActive(false)
            }
        });
    }, []);

    React.useEffect(() => {
        if (contractService) {
            getData()
        }
    }, [userAddress,contractService])

    React.useEffect(() => {
        if (userAddress) {
            getBalance()
        }
    }, [userAddress])

    return (
        <header className={classNames('header', {
            'menu-shown': isMenuActive
        })}>
            <div className="container">
                <div className="header__content">
                    {isTabActive &&
                        <img className="scroll-up-btn" src={scrollUpImg} alt="" onClick={scrollUp} />
                    }

                    <div className="m-menu-btn-wrapper" onClick={() => onMenuBtnClick()}>
                        <span className="m-menu-btn"></span>
                    </div>

                    <div className="header__logo">
                        <NavLink to="/">
                            <img src={logo} alt="" onClick={reload} />
                        </NavLink>
                    </div>

                    <div className="header__menu m-menu">
                        <div className="header__controls">

                            <div
                            ref={sliderButtonRef}
                              className={classNames('header__btn header__nft-card-btn', {
                                  'header__nft-card-btn--active': isSlidesActive
                              })}
                              onClick={() => {
                                  setSlidesActive(!isSlidesActive)
                              }}
                            >
                                <div> My VIP NFT CARD </div>
                                <div className="count-component">
                                    <div className="count-value">
                                        {balance}
                                    </div>
                                </div>
                            </div>

                            <div className="header__paw-card-wrapper" ref={buyErc20Ref}>
                                <div
                                  className="header__btn header__nft-card-btn"
                                  onClick={() => setBuyErc20Active(!isBuyErc20Active)}
                                >
                                    <div className="header__paw-card-btn-text">Buy ERC20</div>

                                    <div className={classNames('count-component-arrow', {
                                        'count-component-arrow--up': isBuyErc20Active,
                                        'count-component-arrow--down': !isBuyErc20Active
                                    })}/>
                                </div>
                                {isBuyErc20Active &&
                                <div className="header__buyErc20-card buyErc20-card">
                                    <CopyToClipboard
                                    text="0x29803d14b84c6372f77d45b3433298e21c27b7cc"
                                    onCopy={() => {
                                        setAddressCopied(true)
                                        setTimeout(() => setAddressCopied(false),2000)
                                    }}
                                    >
                                        <div className="header__erc20address">
                                            { addressCopied ? 'Copied' : '0x29803d14b84c6372f77d45b3433298e21c27b7cc' }
                                        </div>
                                    </CopyToClipboard>
                                    <div>
                                        By sending ETH to this address, you agree to buy $BEAR tokens only, the platform governance tokens. You accept that you are ineligible to the PAW VIP NFTs and will be eligible only if everyone participates through this ERC20 only method, which in-turn implies that we implement a dashboard for ERC20 only contributors to mint VIP PAW NFTs.
                                    </div>
                                </div>
                                }
                            </div>

                            <div className="header__paw-card-wrapper" ref={pawCardRef}>
                                <div
                                  className="header__btn header__paw-card-btn"
                                  onClick={() => setCounterActive(!isCounterActive)}
                                >
                                    {isCrowdsaleClosed && isRefund ?
                                    <div className="header__paw-card-btn-text">REFUND</div> :
                                    <div className="header__paw-card-btn-text">BUY VIP PAW CARD</div>
                                    }

                                    <div className={classNames('count-component-arrow', {
                                        'count-component-arrow--up': isCounterActive,
                                        'count-component-arrow--down': !isCounterActive
                                    })}/>
                                </div>
                                {isCounterActive &&
                                    <div className="header__paw-card paw-card">
                                    <div className="paw-card__counter">
                                      <div className="paw-card__counter-btn paw-card__counter-btn--minus" onClick={() => handleCountCardsChange(-1)}></div>
                                      <div className="paw-card__counter-value">
                                          <input
                                            placeholder="0"
                                            type="number"
                                            value={pawCardAmount}
                                            onChange={handleCountCardsInput}
                                          />
                                      </div>
                                      <div className="paw-card__counter-btn paw-card__counter-btn--plus" onClick={() => handleCountCardsChange(1)}></div>
                                    </div>
                                    <div
                                    className="paw-card__price"
                                    >
                                      {cardPrice && pawCardAmount ?
                                        new BigNumber(cardPrice).multipliedBy(pawCardAmount).toFixed() :
                                        0
                                      } ETH
                                    </div>
                                    {isCrowdsaleClosed && isRefund ?
                                    <div
                                      className="paw-card__buy-btn"
                                      onClick={handleRefund}>
                                        SEND TOKEN
                                    </div> :
                                    <div
                                      className="paw-card__buy-btn"
                                      onClick={handleBuyToken}>
                                        BUY CARD
                                    </div>
                                    }
                                    </div>
                                }
                            </div>
                        </div>

                        <div className="header__menu-footer">
                            <div className="header__copyright">© 2021 BEAR Games. All rights reserved</div>
                            <div className="header__socials">
                                <a href={github_url}><img src={github} alt=""/></a>
                                <a href={medium_url}><img src={medium} alt=""/></a>
                                <a href={twitter_url}><img src={twitter} alt=""/></a>
                                <a href={telegram_url}><img src={telegram} alt=""/></a>
                                <a href={youtube_url}><img src={youtube} alt=""/></a>
                            </div>
                        </div>
                    </div>

                    {isSlidesActive &&
                        <div className="header__swiper" id="swiper" ref={sliderRef}>
                            {balance !== 0 ?
                                <div className="header__swiper-inner">
                                    <div className="swiper-button-prev"></div>
                                    <div className="swiper-button-next"></div>
                                    <Swiper
                                    spaceBetween={0}
                                    slidesPerView={3}
                                    navigation={{
                                        prevEl: '.swiper-button-prev',
                                        nextEl: '.swiper-button-next'
                                    }}
                                    breakpoints={{
                                        0: {
                                            slidesPerView: 1,
                                        },
                                        768: {
                                            slidesPerView: 2,
                                        },
                                        1024: {
                                            slidesPerView: 3,
                                        }
                                    }}
                                    >
                                        {[...new Array(balance)].map((token, it) => {
                                            const index = it;
                                            return (
                                                <SwiperSlide
                                                key={`token-${index}`}
                                                >
                                                    <TokenCardComponent
                                                    index={index}
                                                    />
                                                </SwiperSlide>
                                            )
                                        })}
                                    </Swiper>
                                </div>
                                :
                                <div className="swiper-empty">
                                    nothing yet
                                </div>
                            }
                        </div>
                    }

                </div>
            </div>
        </header>
    );
}

export default Header;
